//for datatable
$(document).ready( function () {
    $('#datatable').dataTable();
} );


$(document).ready(function(){
    $("#searchinput").on("keyup", function() {
      var value = $(this).val().toLowerCase();
      $("#searchlist *").filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
      });
    });
  });


function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {           
            $('#imagePreview').css('background-image', 'url('+e.target.result +')');
            $('#imagePreview').show();
        }
        console.log(input.files[0]);
        reader.readAsDataURL(input.files[0]);
    }
}

$("#imageUpload").change(function() {
    readURL(this);
});